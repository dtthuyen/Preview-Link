import * as React from 'react'
import {
  Image,
  LayoutAnimation,
  Linking,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
  View,
  ViewStyle,
} from 'react-native'
import { PreviewData, PreviewDataImage } from './types'
import { getPreviewData, oneOf } from './utils'
import styled from 'styled-components/native'
import { Fonts } from '@base/ui-kit'

export interface LinkPreviewProps {
  containerStyle?: StyleProp<ViewStyle>
  enableAnimation?: boolean
  metadataContainerStyle?: StyleProp<ViewStyle>
  metadataTextContainerStyle?: StyleProp<ViewStyle>
  renderDescription?: (description: string) => React.ReactNode
  renderImage?: (image: PreviewDataImage) => React.ReactNode
  renderLinkPreview?: (previewData?: PreviewData) => React.ReactNode
  renderTitle?: (title: string) => React.ReactNode
  requestTimeout?: number
  text: string
  touchableWithoutFeedbackProps?: TouchableWithoutFeedbackProps
}

const containerWidth = 60;

export const LinkPreview = React.memo(
  ({
    containerStyle,
    enableAnimation,
    metadataContainerStyle,
    metadataTextContainerStyle,
    renderDescription,
    renderImage,
    renderLinkPreview,
    renderTitle,
    requestTimeout = 5000,
    text,
    touchableWithoutFeedbackProps,
  }: LinkPreviewProps) => {
    const [data, setData] = React.useState<PreviewData>()
    
    React.useEffect(() => {
      let isCancelled = false;
      
      const fetchData = async () => {
        setData(undefined)
        const newData = await getPreviewData(text, requestTimeout)
        // Set data only if component is still mounted
        /* istanbul ignore next */
        if (!isCancelled) {
          // No need to cover LayoutAnimation
          /* istanbul ignore next */
          if (enableAnimation) {
            LayoutAnimation.easeInEaseOut()
          }
          setData(newData)
        }
      }

      fetchData()
      return () => {
        isCancelled = true
      }
    }, [
      enableAnimation,
      requestTimeout,
      text,
    ])

    const handlePress = React.useCallback(() => {
      data?.link && Linking.openURL(data.link);
    }, [data?.link])

    const renderTitleNode = (title: string) => {
      return oneOf(
        renderTitle,
        <STitle numberOfLines={2} >
          {title}
        </STitle>
      )(title)
    }

    const renderDescriptionNode = (description: string) => {
      return oneOf(
        renderDescription,
        <SText numberOfLines={3} >
          {description}
        </SText>
      )(description)
    }

    const renderImageNode = (image: PreviewDataImage) => {
      const aspectRatio = data?.image ? data.image.width / data.image.height : 1;
      return oneOf(
        renderImage,
        <Image
          accessibilityRole='image'
          resizeMode='contain'
          source={{ uri: image.url }}
          style={StyleSheet.flatten([
            { marginRight: 8, borderRadius: 2 },
            aspectRatio < 1
              ? {
                height: containerWidth,
                width: containerWidth * aspectRatio,
              }
              : {
                height: containerWidth / aspectRatio,
                width: containerWidth,
              }
          ])}
        />
      )(image)
    }
    
    const renderLinkPreviewNode = () => {
      return oneOf(
        renderLinkPreview,
        <ViewPreviewLink style={containerStyle}>
          <View
              style={StyleSheet.flatten([
                styles.metadataContainer,
                metadataContainerStyle,
              ])}
            >
              {data?.image && renderImageNode(data.image)}
              <View
                style={StyleSheet.flatten([
                  styles.metadataTextContainer,
                  metadataTextContainerStyle,
                ])}
              >
                {(data?.title || data?.link) && renderTitleNode(data.title || data.link || '')}
                {(data?.description || data?.domain) && renderDescriptionNode(data.description || data?.domain || '')}
              </View>
            </View>
        </ViewPreviewLink>
      )(data)
    }

    return ((data?.description || data?.title || (data?.link && data?.domain)) ? (
      <TouchableWithoutFeedback
        accessibilityRole='button'
        onPress={handlePress}
        {...touchableWithoutFeedbackProps}
      >
        {renderLinkPreviewNode()}
      </TouchableWithoutFeedback>
    ) : <></>
    )
  }
)

const ViewPreviewLink = styled.View`
  background-color: ${p => p.theme.grey6};
  border-bottom-width: 0.5px;
  border-top-width: 0.5px;
  border-color: ${p => p.theme.grey5};
`

const STitle = styled.Text`
  font-size: 13px;
  font-family: ${Fonts.Bold};
  color: ${p => p.theme.grey1};
`

const SText = styled.Text`
  font-size: 12px;
  color: ${p => p.theme.grey2};
  margin-top: 4px;
`

const styles = StyleSheet.create({
  metadataContainer: {
    flexDirection: 'row',
    padding: 12
  },
  metadataTextContainer: {
    flex: 1,
  },
})
